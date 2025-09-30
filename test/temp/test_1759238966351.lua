--
 -- ═══════════════════════════════════════════════════════════════════════════════
 -- 🌟 LUASCRIPT - THE COMPLETE VISION 🌟
 -- ═══════════════════════════════════════════════════════════════════════════════
 -- 
 -- MISSION: Give JavaScript developers Mojo-like superpowers
 -- 
 -- THE FIVE PILLARS:
 -- 1. 💪 Mojo-Like Superpowers: JavaScript syntax + Native performance + System access
 -- 2. 🤖 Self-Building Agentic IDE: AI-powered IDE written in LUASCRIPT for LUASCRIPT
 -- 3. 🔢 Balanced Ternary Computing: Revolutionary (-1,0,+1) logic for quantum-ready algorithms
 -- 4. 🎨 CSS Evolution: CSS → Gaussian CSS → GSS → AGSS (AI-driven adaptive design)
 -- 5. ⚡ Great C Support: Seamless FFI, inline C, full ecosystem access
 -- 
 -- VISION: "Possibly impossible to achieve but dammit, we're going to try!"
 -- 
 -- This file is part of the LUASCRIPT revolution - a paradigm shift in programming
 -- that bridges JavaScript familiarity with native performance, AI-driven tooling,
 -- novel computing paradigms, and revolutionary styling systems.
 -- 
 -- 📖 Full Vision: See VISION.md, docs/vision_overview.md, docs/architecture_spec.md
 -- 🗺️ Roadmap: See docs/roadmap.md
 -- 💾 Backup: See docs/redundant/vision_backup.txt
 -- ═══════════════════════════════════════════════════════════════════════════════
 --/


-- LUASCRIPT Runtime Library Integration
local runtime = require('runtime.runtime')
local console = runtime.console
local JSON = runtime.JSON
local Math = runtime.Math

local name = "John";
local age = 25;
local message = "Name: " .. name .. ", Age: " + age;
local isAdult = age >= 18 and name ~= "";
console.log(message);
console.log("Is adult:", isAdult);