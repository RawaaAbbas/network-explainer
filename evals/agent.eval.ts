import { runAgent } from "../lib/run-agent";

const RUNS = 3;
const DELAY_MS = 10000;

const badConfig = `hostname R1
enable password cisco
line vty 0 4
 password cisco
 transport input telnet
 login`;

type Case = {
  name: string;
  message: string;
  expectedTool: string;
  mustContain: string[];
};

const cases: Case[] = [
  {
    name: "split /24 into 4 subnets",
    message: "Split the network 192.168.1.0/24 into 4 subnets",
    expectedTool: "calculate_subnet",
    mustContain: [
      "255.255.255.192",
      "192.168.1.64",
      "192.168.1.128",
      "192.168.1.192",
      "192.168.1.255",
    ],
  },
  {
    name: "broadcast of 172.16.5.9/16",
    message: "What is the broadcast address of 172.16.5.9/16?",
    expectedTool: "calculate_subnet",
    mustContain: ["172.16.255.255"],
  },
  {
    name: "security check of a config",
    message: `Explain this config and find the security problems:\n${badConfig}`,
    expectedTool: "check_config_security",
    mustContain: ["telnet"],
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  let totalPassed = 0;
  let total = 0;

  for (const c of cases) {
    let passed = 0;

    for (let i = 0; i < RUNS; i++) {
      total++;
      try {
        const out = await runAgent(c.message);
        const text = (out?.result ?? "").toLowerCase();
        const tools = out?.steps.map((s) => s.tool) ?? [];

        const usedTool = tools.includes(c.expectedTool);
        const missing = c.mustContain.filter(
          (x) => !text.includes(x.toLowerCase()),
        );

        if (usedTool && missing.length === 0) {
          passed++;
        } else {
          console.log(
            `run ${i + 1} FAIL | tools: ${tools.join(", ") || "none"} | missing: ${missing.join(", ") || "-"}`,
          );
        }
      } catch (error) {
        console.log(`  run ${i + 1} ERROR`, error);
      }
      await sleep(DELAY_MS);
    }

    totalPassed += passed;
    console.log(`${passed}/${RUNS} - ${c.name}`);
  }

  console.log(`\nTotal: ${totalPassed}/${total}`);
}

main();
