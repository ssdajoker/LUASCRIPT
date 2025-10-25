# Quality Report

## ESLint

```

/home/mrjenkins/LUASCRIPT/examples/crashers/deep_scope_shadowing.js
  2:9   warning  'label' is never reassigned. Use 'const' instead  prefer-const
  4:13  warning  'label' is never reassigned. Use 'const' instead  prefer-const

/home/mrjenkins/LUASCRIPT/examples/phase1b_demo.js
   8:5   warning  'firstName' is never reassigned. Use 'const' instead        prefer-const
   9:5   warning  'lastName' is never reassigned. Use 'const' instead         prefer-const
  10:5   warning  'fullName' is never reassigned. Use 'const' instead         prefer-const
  14:5   warning  'age' is never reassigned. Use 'const' instead              prefer-const
  15:5   warning  'hasLicense' is never reassigned. Use 'const' instead       prefer-const
  16:5   warning  'canDrive' is never reassigned. Use 'const' instead         prefer-const
  17:5   warning  'needsPermission' is never reassigned. Use 'const' instead  prefer-const
  23:5   warning  'score' is never reassigned. Use 'const' instead            prefer-const
  24:5   warning  'isPerfect' is never reassigned. Use 'const' instead        prefer-const
  25:5   warning  'isNotZero' is never reassigned. Use 'const' instead        prefer-const
  38:9   warning  'greeting' is never reassigned. Use 'const' instead         prefer-const
  39:9   warning  'ageInfo' is never reassigned. Use 'const' instead          prefer-const
  42:13  warning  'message' is never reassigned. Use 'const' instead          prefer-const
  46:13  warning  'message' is never reassigned. Use 'const' instead          prefer-const

/home/mrjenkins/LUASCRIPT/src/core_transpiler.js
  93:25  warning  'category' is assigned a value but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/src/enhanced_operators.js
  24:19  warning  'operator' is assigned a value but never used  no-unused-vars
  78:15  warning  'operator' is assigned a value but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/src/enhanced_transpiler.js
   16:7   warning  'path' is assigned a value but never used           no-unused-vars
  587:13  warning  'inTable' is never reassigned. Use 'const' instead  prefer-const

/home/mrjenkins/LUASCRIPT/src/index.js
  213:15  warning  'report' is assigned a value but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/src/ir/pipeline.js
  22:9  warning  'lexer' is assigned a value but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/src/optimized_transpiler.js
   13:7   warning  'fs' is assigned a value but never used            no-unused-vars
   14:7   warning  'path' is assigned a value but never used          no-unused-vars
   30:21  warning  'poolName' is assigned a value but never used      no-unused-vars
  178:15  warning  'codeBuffer' is assigned a value but never used    no-unused-vars
  459:20  warning  'astResult' is assigned a value but never used     no-unused-vars
  459:31  warning  'luaGenResult' is assigned a value but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/src/parser.js
  540:18  warning  'error' is defined but never used                no-unused-vars
  549:13  warning  'expr' is never reassigned. Use 'const' instead  prefer-const

/home/mrjenkins/LUASCRIPT/src/performance_tools.js
   10:9   warning  'Worker' is assigned a value but never used                      no-unused-vars
   10:17  warning  'isMainThread' is assigned a value but never used                no-unused-vars
   10:31  warning  'parentPort' is assigned a value but never used                  no-unused-vars
   10:43  warning  'workerData' is assigned a value but never used                  no-unused-vars
  315:13  warning  'appliedOptimizations' is never reassigned. Use 'const' instead  prefer-const
  488:18  warning  'error' is defined but never used                                no-unused-vars
  527:18  warning  'error' is defined but never used                                no-unused-vars

/home/mrjenkins/LUASCRIPT/src/phase1_core_lexer.js
  176:15  warning  'start' is assigned a value but never used  no-unused-vars
  272:15  warning  'start' is assigned a value but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/src/phase1_core_parser.js
   18:54  warning  'TemplateLiteralNode' is assigned a value but never used  no-unused-vars
   19:5   warning  'TemplateElementNode' is assigned a value but never used  no-unused-vars
   19:37  warning  'ASTUtils' is assigned a value but never used             no-unused-vars
  626:22  warning  'error' is defined but never used                         no-unused-vars

/home/mrjenkins/LUASCRIPT/src/phase2_core_interpreter.js
    9:5   warning  'ProgramNode' is assigned a value but never used                  no-unused-vars
    9:18  warning  'BlockStatementNode' is assigned a value but never used           no-unused-vars
    9:38  warning  'ExpressionStatementNode' is assigned a value but never used      no-unused-vars
   10:5   warning  'VariableDeclarationNode' is assigned a value but never used      no-unused-vars
   10:30  warning  'VariableDeclaratorNode' is assigned a value but never used       no-unused-vars
   10:54  warning  'FunctionDeclarationNode' is assigned a value but never used      no-unused-vars
   11:5   warning  'ReturnStatementNode' is assigned a value but never used          no-unused-vars
   11:26  warning  'IfStatementNode' is assigned a value but never used              no-unused-vars
   11:43  warning  'WhileStatementNode' is assigned a value but never used           no-unused-vars
   11:63  warning  'ForStatementNode' is assigned a value but never used             no-unused-vars
   12:5   warning  'BreakStatementNode' is assigned a value but never used           no-unused-vars
   12:25  warning  'ContinueStatementNode' is assigned a value but never used        no-unused-vars
   12:48  warning  'BinaryExpressionNode' is assigned a value but never used         no-unused-vars
   13:5   warning  'UnaryExpressionNode' is assigned a value but never used          no-unused-vars
   13:26  warning  'AssignmentExpressionNode' is assigned a value but never used     no-unused-vars
   13:52  warning  'UpdateExpressionNode' is assigned a value but never used         no-unused-vars
   14:5   warning  'LogicalExpressionNode' is assigned a value but never used        no-unused-vars
   14:28  warning  'ConditionalExpressionNode' is assigned a value but never used    no-unused-vars
   14:55  warning  'CallExpressionNode' is assigned a value but never used           no-unused-vars
   15:5   warning  'MemberExpressionNode' is assigned a value but never used         no-unused-vars
   15:27  warning  'ArrayExpressionNode' is assigned a value but never used          no-unused-vars
   15:48  warning  'ObjectExpressionNode' is assigned a value but never used         no-unused-vars
   16:5   warning  'PropertyNode' is assigned a value but never used                 no-unused-vars
   16:19  warning  'ArrowFunctionExpressionNode' is assigned a value but never used  no-unused-vars
   16:48  warning  'FunctionExpressionNode' is assigned a value but never used       no-unused-vars
   17:5   warning  'LiteralNode' is assigned a value but never used                  no-unused-vars
   17:18  warning  'IdentifierNode' is assigned a value but never used               no-unused-vars
   17:34  warning  'ThisExpressionNode' is assigned a value but never used           no-unused-vars
  399:23  warning  Expected '===' and instead saw '=='                               eqeqeq
  657:36  warning  Expected '===' and instead saw '=='                               eqeqeq
  658:36  warning  Expected '!==' and instead saw '!='                               eqeqeq
  850:27  warning  Expected '!==' and instead saw '!='                               eqeqeq
  866:27  warning  Expected '!==' and instead saw '!='                               eqeqeq

/home/mrjenkins/LUASCRIPT/src/phase2_core_modules.js
  123:26  warning  'error' is defined but never used  no-unused-vars
  140:26  warning  'error' is defined but never used  no-unused-vars
  153:22  warning  'error' is defined but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/src/phase5_enterprise_optimization.js
  270:21  warning  'type' is assigned a value but never used         no-unused-vars
  526:15  warning  'startMemory' is assigned a value but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/src/phase6_production_deployment.js
    9:7   warning  'path' is assigned a value but never used  no-unused-vars
  125:56  warning  Expected '===' and instead saw '=='        eqeqeq
  127:56  warning  Expected '!==' and instead saw '!='        eqeqeq

/home/mrjenkins/LUASCRIPT/src/phase9_ecosystem.js
   12:7   warning  'fs' is assigned a value but never used          no-unused-vars
   13:7   warning  'path' is assigned a value but never used        no-unused-vars
  907:30  warning  'depVersion' is assigned a value but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/src/runtime_system.js
   10:31  warning  'parentPort' is assigned a value but never used  no-unused-vars
   10:43  warning  'workerData' is assigned a value but never used  no-unused-vars
  395:18  warning  'error' is defined but never used                no-unused-vars

/home/mrjenkins/LUASCRIPT/src/unified_luascript.js
  106:17  warning  'result' is never reassigned. Use 'const' instead  prefer-const
  355:18  warning  'error' is defined but never used                  no-unused-vars
  373:18  warning  'error' is defined but never used                  no-unused-vars
  392:18  warning  'error' is defined but never used                  no-unused-vars
  404:13  warning  'score' is never reassigned. Use 'const' instead   prefer-const
  415:13  warning  'score' is never reassigned. Use 'const' instead   prefer-const
  423:13  warning  'score' is never reassigned. Use 'const' instead   prefer-const
  437:13  warning  'score' is never reassigned. Use 'const' instead   prefer-const

/home/mrjenkins/LUASCRIPT/src/wasm_backend.js
  7:7  warning  'fs' is assigned a value but never used    no-unused-vars
  8:7  warning  'path' is assigned a value but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/test/test_enhanced_transpiler.js
  14:7  warning  'fs' is assigned a value but never used    no-unused-vars
  15:7  warning  'path' is assigned a value but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/test/test_perfect_parser_phase1.js
  13:7   warning  'path' is assigned a value but never used      no-unused-vars
  14:7   warning  'fs' is assigned a value but never used        no-unused-vars
  24:10  warning  'expectNotIncludes' is defined but never used  no-unused-vars
  63:14  warning  'e' is defined but never used                  no-unused-vars

/home/mrjenkins/LUASCRIPT/test/test_perfect_parser_phase1_negative.js
  11:24  warning  'e' is defined but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/test/test_phase1_6_comprehensive.js
   12:9   warning  'ModuleLoader' is assigned a value but never used  no-unused-vars
  394:19  warning  'result' is assigned a value but never used        no-unused-vars

/home/mrjenkins/LUASCRIPT/test/test_unified_system.js
  263:13  warning  'global' is not defined  no-undef
  264:13  warning  'global' is not defined  no-undef

/home/mrjenkins/LUASCRIPT/test_optimizations.js
  232:15  warning  'result' is assigned a value but never used  no-unused-vars

/home/mrjenkins/LUASCRIPT/tests/test_memory_management.js
  217:11  warning  'obj1' is assigned a value but never used  no-unused-vars
  220:11  warning  'obj2' is assigned a value but never used  no-unused-vars

✖ 115 problems (0 errors, 115 warnings)
  0 errors and 24 warnings potentially fixable with the `--fix` option.


```

## LuaCheck

_No data_

## Python Lint

_No data_

## Semgrep JSON (truncated)

```
{"version":"1.139.0","results":[],"errors":[{"code":3,"level":"warn","type":["PartialParsing",[{"path":"templates/documentation.html","start":{"line":365,"col":61,"offset":0},"end":{"line":365,"col":76,"offset":15}},{"path":"templates/documentation.html","start":{"line":437,"col":17,"offset":0},"end":{"line":449,"col":3,"offset":244}},{"path":"templates/documentation.html","start":{"line":457,"col":20,"offset":0},"end":{"line":464,"col":43,"offset":219}},{"path":"templates/documentation.html","start":{"line":480,"col":50,"offset":0},"end":{"line":480,"col":57,"offset":7}},{"path":"templates/documentation.html","start":{"line":723,"col":17,"offset":0},"end":{"line":747,"col":25,"offset":528}},{"path":"templates/documentation.html","start":{"line":753,"col":20,"offset":0},"end":{"line":766,"col":2,"offset":343}}]],"message":"Syntax error at line templates/documentation.html:365:\n `& Accessibility` was unexpected","path":"templates/documentation.html","spans":[{"file":"templates/documentation.html","start":{"line":365,"col":61,"offset":0},"end":{"line":365,"col":76,"offset":15}},{"file":"templates/documentation.html","start":{"line":437,"col":17,"offset":0},"end":{"line":449,"col":3,"offset":244}},{"file":"templates/documentation.html","start":{"line":457,"col":20,"offset":0},"end":{"line":464,"col":43,"offset":219}},{"file":"templates/documentation.html","start":{"line":480,"col":50,"offset":0},"end":{"line":480,"col":57,"offset":7}},{"file":"templates/documentation.html","start":{"line":723,"col":17,"offset":0},"end":{"line":747,"col":25,"offset":528}},{"file":"templates/documentation.html","start":{"line":753,"col":20,"offset":0},"end":{"line":766,"col":2,"offset":343}}]},{"code":3,"level":"warn","type":["PartialParsing",[{"path":"templates/ide.html","start":{"line":403,"col":19,"offset":0},"end":{"line":419,"col":42,"offset":339}}]],"message":"Syntax error at line templates/ide.html:403:\n `> a + b;\nlet multiply = (x, y) => {\n    let result = x * y;\n    return result;\n};\n\n// Test the functions\nprint(\"Addition: \" + add(3, 4));\nprint(\"Multiplication: \" + multiply(6, 7));\n\n// Memory management example\nlet factorial = n => {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n};\n\nprint(\"Factorial of 5: \" + factorial(5));` was unexpected","path":"templates/ide.html","spans":[{"file":"templates/ide.html","start":{"line":403,"col":19,"offset":0},"end":{"line":419,"col":42,"offset":339}}]}],"paths":{"scanned":[".github/CODEOWNERS",".github/ISSUE_TEMPLATE/bug_report.md",".github/ISSUE_TEMPLATE/bug_report.pdf",".github/ISSUE_TEMPLATE/feature_request.md",".github/ISSUE_TEMPLATE/feature_request.pdf",".github/PULL_REQUEST_TEMPLATE.md",".github/PULL_REQUEST_TEMPLATE.pdf",".github/workflows/ci.yml",".gitignore",".husky/pre-push",".mailmap","AUDIT_GUIDE.md","AUDIT_GUIDE.pdf","AUDIT_PLAN.md","AUDIT_PLAN.pdf","AUDIT_PROTOCOL.md","AUDIT_PROTOCOL.pdf","BOSS_RESTRUCTURING_SUMMARY.md","BOSS_RESTRUCTURING_SUMMARY.pdf","CHECKLIST_PHASES.md","CHECKLIST_PHASES.pdf","CODE_OF_CONDUCT.md","CONTRIBUTING.md","DAILY_EXECUTION_MONITORING.md","DAILY_EXECUTION_MONITORING.pdf","DEPLOYMENT_COMPLETE.md","DEPLOYMENT_COMPLETE.pdf","DESIGN_GSS.md","DESIGN_GSS.pdf","ENHANCED_TRANSPILER_README.md","GIT_DISABLED_README.md","GSS_AGSS_IMPLEMENTATION_SUMMARY.md","GSS_AGSS_IMPLEMENTATION_SUMMARY.pdf","IMPLEMENTATION_SUMMARY.md","INCENTIVE_TRACKING.md","INCENTIVE_TRACKING.pdf","LICENSE","META_OVERSIGHT.md","META_OVERSIGHT.pdf","META_TEAM.md","META_TEAM.pdf","META_TEAM_LEADERSHIP_ACTIVATION.md","META_TEAM_LEADERSHIP_ACTIVATION.pdf","PHASE4_LAUNCH_AUDIT_CHECKLIST.pdf","PHASE5_6_PLAN.md","PHASE5_6_PLAN.pdf","PHASE8_A6_COMPLETE.md","PHASE8_A6_COMPLETE.pdf","PHASE9_COMPLETE.md","PHASE9_COMPLETE.pdf","PHASE_PLAN.md","PHASE_PLAN.pdf","PROJECT_STATUS.md","PROJECT_STATUS.pdf","QUALITY_GATES_ENFORCEMENT.md","QUALITY_GATES_ENFORCEMENT.pdf","README.md","README_PHASE_1D.md","TEAMS.md","TEAMS.pdf","TEAM_ASSIGNMENTS.csv","TODO.md","TODO.pdf","TODO_GSS_AGSS.md","TODO_GSS_AGSS.pdf","TRUE_100_AT_100_ACHIEVED.md","TRUE_100_AT_100_ACHIEVED.pdf","audit/.gitkeep","audit/CHECKLIST.md","audit/FILE_TREE.md","audit/adr_index.csv","audit/classified_files.json","audit/classify.js","audit/cloc.json","audit/deps.js","audit/deps.json","audit/deps_report.md","audit/docs_index.csv","audit/eslint.config.mjs","audit/eslint.txt","audit/files_all.txt","audit/gitfiles_mtime.tsv","audit/ideation.js","audit/ideation_hits.txt","audit/implementation_map.json","audit/implmap.js","audit/local_summary.js","audit/local_summary.md","audit/luacheck.txt","audit/python_lint.txt","audit/quality.js","audit/quality_report.md","audit/run_all.sh","audit/semgrep.json","audit/tests_output.txt","audit/tests_report.md","audit/tests_summary.js","audit/utils.js","daily_standup_cron.txt","docs/COMMUNITY.md","docs/COMMUNITY.pdf","docs/CROSS_PLATFORM_VALIDATION.md","docs/PARSER_RUNTIME_PARITY_PLAN.md","docs/PERFECT_PARSER_PHASE1_TODO.md","docs/PHASE1A_RUNTIME_TICKETS.md","docs/PHASE1A_STANDUP_CHECKLIST.md","docs/STRATEGIC_PLAN.md","docs/TEAM_ROLES.md","docs/TEAM_ROLES.pdf","docs/WEEK6_RUNWAY_PREP.md","docs/adr/0001-decision-transpiler-architecture.md","docs/adr/0002-decision-runtime-memory-management.md","docs/audits/phase3_algorithms.md","docs/canonical_ir_spec.md","docs/phase3_integration_plan.md","docs/phase3_integration_plan.pdf","docs/testing/legacy-harness-modularization.md","docs/testing/legacy_harness_modularization.md","docs/tony_yoka_optimization_report.md","docs/tony_yoka_optimization_report.pdf","examples/crashers/chained_recursion.js","examples/crashers/deep_scope_shadowing.js","examples/crashers/runtime_gc_edge.js","examples/crashers/table_metatable_cycle.js","examples/phase1b_demo.js","gss/README.md","gss/agss/agent.lua","gss/agss/metrics.lua","gss/agss/strategies.lua","gss/benchmarks/bench_agss.lua","gss/benchmarks/bench_gss.lua","gss/grammar/agss.lpeg","gss/grammar/gss.lpeg","gss/ir/graph.lua","gss/ir/lowering.lua","gss/ir/nodes.lua","gss/parser/ast.lua","gss/parser/parser.lua","gss/parser/semantic.lua","gss/runtime/blend.lua","gss/runtime/cache.lua","gss/runtime/engine.lua","gss/runtime/gaussian.lua","gss/runtime/iso.lua","gss/runtime/ramp.lua","gss/runtime/wasm.lua","ide/README.md","ide/TUTORIAL.md","ide/TUTORIAL.pdf","ide/gaussian-blobs-demo.html","package-lock.json","package.json","package.json.backup","phase5/README.md","reports/canonical_ir_status.md","reports/cross_platform/2025-10-12-linux/benchmark.json","reports/cross_platform/2025-10-12-linux/command_output.txt","reports/cross_platform/2025-10-12-linux/summary.md","reports/cross_platform/2025-10-12-macos/command_output.txt","reports/cross_platform/2025-10-12-macos/summary.md","reports/cross_platform/2025-10-12-windows/command_output.txt","reports/cross_platform/2025-10-12-windows/summary.md","reports/cross_platform/PHASE1A-rollup.md","reports/perf/benchmark-verification-addendum.md","reports/perf/callgraphs/phase3-lite/README.md","reports/phase7_feasibility_report.md","reports/phase7_feasibility_report.pdf","reports/round0/baseline_test_results.txt","reports/round0/lua_test_results.txt","reports/round0/phase4_test_results.txt","reports/round0/static_analysis.txt","reports/round1/final/audit_report.md","reports/round1/integration/cross_phase.txt","reports/round1/static/luacheck.txt","reports/round1/unit/full_suite.txt","reports/static_hygiene_update.md","runtime/runtime.lua","runtime_runtime.json","scripts/bonus_tracker.lua","scripts/build_wasm.sh","scripts/daily_standup_monitor.lua","scripts/kickoff_phase3_parallel.sh","scripts/leadership_activation_runner.lua","scripts/run_audit_round.sh","scripts/run_gss_tests.sh","scripts/run_micro_benchmark.js","scripts/setup_daily_monitoring.sh","scripts/smoke_ci.js","scripts/tmp_phase1_debug.js","scripts/validate_quality_gates.sh","src/advanced_async.js","src/advanced_features.js","src/agentic_ide.js","src/agents/auditor-agent.test.ts","src/agents/auditor-agent.ts","src/agents/resolver-agent.test.ts","src/agents/resolver-agent.ts","src/core/symbol-table.test.ts","src/core/symbol-table.ts","src/core_transpiler.js","src/enhanced_operators.js","src/enhanced_transpiler.js","src/ide/resolution-diagnostics.js","src/ide/resolution-diagnostics.test.ts","src/ide/resolution-diagnostics.ts","src/index.js","src/ir/builder.js","src/ir/emitter.js","src/ir/idGenerator.js","src/ir/lowerer.js","src/ir/nodes.js","src/ir/normalizer.js","src/ir/pipeline.js","src/ir/validator.js","src/language/parser.test.ts","src/language/parser.ts","src/language/tokenizer.ts","src/meta_team_activation.lua","src/optimized_transpiler.js","src/parser.js","src/performance_tools.js","src/phase1_core_ast.js","src/phase1_core_lexer.js","src/phase1_core_parser.js","src/phase2_core_interpreter.js","src/phase2_core_modules.js","src/phase3_advanced_features.lua","src/phase3_compiler_optimizations.lua","src/phase4_debugging_profiling.lua","src/phase4_ecosystem_integration.lua","src/phase5_enterprise_optimization.js","src/phase6_production_deployment.js","src/phase8_complete.js","src/phase9_ecosystem.js","src/runtime.js","src/runtime_system.js","src/transpiler.js","src/unified_luascript.js","src/wasm_backend.js","src_transpiler.json","static_warnings.txt","static_warnings_after_all_self.txt","static_warnings_after_loops.txt","static_warnings_after_manual.txt","static_warnings_after_self.txt","static_warnings_after_unused.txt","static_warnings_after_variables.txt","static_warnings_after_variables_final.txt","static_warnings_after_whitespace.txt","static_warnings_clean.txt","static_warnings_line_fixed.txt","static_warnings_near_final.txt","static_warnings_syntax_fixed.txt","static_warnings_variables_done.txt","templates/documentation.html","templates/ide.html","test_optimizations.js","test_report.txt","test_transpiler.json","tsconfig.json"]},"time":{"rules":[],"rules_parse_time":0.6638979911804199,"profiling_times":{"config_time":1.3530666828155518,"core_time":2.808499574661255,"ignores_time":0.0008177757263183594,"total_time":4.164062023162842},"parsing_time":{"total_time":0.0,"per_file_time":{"mean":0.0,"std_dev":0.0},"very_slow_stats":{"time_ratio":0.0,"count_ratio":0.0},"very_slow_files":[]},"scanning_time":{"total_time":5.068896532058716,"per_file_time":{"mean":0.008649994082011461,"std_dev":0.0025797990058752146},"very_slow_stats":{"time_ratio":0.0,"count_ratio":0.0},"very_slow_files":[]},"matching_time":{"total_time":0.0,"per_file_and_rule_time":{"mean":0.0,"std_dev":0.0},"very_slow_stats":{"time_ratio":0.0,"count_ratio":0.0},"very_slow_rules_on_files":[]},"tainting_time":{"total_time":0.0,"per_def_and_rule_time":{"mean":0.0,"std_dev":0.0},"very_slow_stats":{"time_ratio":0.0,"count_ratio":0.0},"very_slow_rules_on_defs":[]},"fixpoint_timeouts":[],"prefiltering":{"project_level_time":0.0,"file_level_time":0.0,"rules_with_project_prefilters_ratio":0.0,"rules_with_file_prefilters_ratio":0.9960578186596584,"rules_selected_ratio":0.0519053876478318,"rules_matched_ratio":0.0519053876478318},"targets":[],"total_bytes":0,"max_memory_bytes":229388160},"engine_requested":"OSS","skipped_rules":[]}

```
