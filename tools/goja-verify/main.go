// Command goja-verify runs the story replay goldens in goja, the JavaScript engine of the hub's
// Nakama server runtime, against dist/arcade-sim.server.js: the same cases as
// qa/server-sim-goldens.mjs (qa/server-sim-cases.js), including the fuzz hashes Node recorded.
//
//	cd tools/goja-verify && go run . [repo root]
//
// It exits non-zero when any case fails, and prints per-golden replay times.
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"time"

	"github.com/dop251/goja"
)

func must(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}
}

func main() {
	root := "../.."
	if len(os.Args) > 1 {
		root = os.Args[1]
	}
	bundle, err := os.ReadFile(filepath.Join(root, "dist/arcade-sim.server.js"))
	must(err)
	cases, err := os.ReadFile(filepath.Join(root, "qa/server-sim-cases.js"))
	must(err)
	names, err := filepath.Glob(filepath.Join(root, "qa/golden/story-*.json"))
	must(err)
	sort.Strings(names)
	golden := regexp.MustCompile(`story-\d+\.json$`)
	goldens := "["
	for i, name := range names {
		if !golden.MatchString(name) {
			continue
		}
		text, err := os.ReadFile(name)
		must(err)
		if i > 0 {
			goldens += ","
		}
		goldens += string(text)
	}
	goldens += "]"
	fuzz, err := os.ReadFile(filepath.Join(root, "qa/golden/fuzz.json"))
	must(err)

	vm := goja.New()
	start := time.Now()
	must(vm.Set("__now", func() float64 { return float64(time.Since(start).Nanoseconds()) / 1e6 }))
	must(vm.Set("__goldens", goldens))
	must(vm.Set("__fuzz", string(fuzz)))
	// The bundle is loaded as a plain script, the way the hub concatenates it into its runtime.
	loadStart := time.Now()
	_, err = vm.RunString(string(bundle))
	must(err)
	loadMs := float64(time.Since(loadStart).Microseconds()) / 1000
	_, err = vm.RunString(string(cases))
	must(err)
	out, err := vm.RunString(`JSON.stringify((function () {
		var r = runServerSimCases(ArcadeSim, JSON.parse(__goldens), JSON.parse(__fuzz), __now);
		var replay = {}, max = 0, sum = 0, n = 0, failures = [];
		for (var i = 0; i < r.results.length; i++) {
			var x = r.results[i];
			if (!x.pass) failures.push(x);
			if (x.ms !== undefined) { replay[x.name.replace('golden ', '')] = x.ms; max = Math.max(max, x.ms); sum += x.ms; n++; }
		}
		return { version: ArcadeSim.ARCADE_SIM_VERSION, header: ARCADE_SIM_VERSION, passed: r.passed, failed: r.failed,
			failures: failures, replayMs: { perGolden: replay, max: max, mean: Math.round(sum / n * 10) / 10 } };
	})())`)
	must(err)
	var report map[string]any
	must(json.Unmarshal([]byte(out.String()), &report))
	report["kind"] = "story-replay-goldens-goja"
	report["bundleLoadMs"] = loadMs
	status := "passed"
	if report["failed"].(float64) > 0 || report["version"] != report["header"] {
		status = "failed"
	}
	report["status"] = status
	text, _ := json.MarshalIndent(report, "", " ")
	fmt.Println(string(text))
	if status != "passed" {
		os.Exit(1)
	}
}
