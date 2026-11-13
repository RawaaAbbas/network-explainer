import { calculateSubnet, checkConfigSecurity } from "../lib/tools";

let failed = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(ok ? "PASS" : "FAIL", "-", name);
  if (!ok) console.log("  expected:", expected, "\n  actual:  ", actual);
}

check("/24", calculateSubnet("192.168.1.0", 24), {
  network: "192.168.1.0",
  broadcast: "192.168.1.255",
  subnetMask: "255.255.255.0",
  totalAddresses: 256,
  usableHosts: 254,
  firstHost: "192.168.1.1",
  lastHost: "192.168.1.254",
});

check("/26 with a host IP", calculateSubnet("192.168.1.130", 26), {
  network: "192.168.1.128",
  broadcast: "192.168.1.191",
  subnetMask: "255.255.255.192",
  totalAddresses: 64,
  usableHosts: 62,
  firstHost: "192.168.1.129",
  lastHost: "192.168.1.190",
});

check("/30", calculateSubnet("10.0.0.0", 30), {
  network: "10.0.0.0",
  broadcast: "10.0.0.3",
  subnetMask: "255.255.255.252",
  totalAddresses: 4,
  usableHosts: 2,
  firstHost: "10.0.0.1",
  lastHost: "10.0.0.2",
});

check("invalid IP", "error" in calculateSubnet("300.1.1.1", 24), true);

const badConfig = `hostname R1
enable password cisco
interface GigabitEthernet0/0
 ip address 192.168.1.1 255.255.255.0
 no shutdown
router ospf 1
 network 192.168.1.0 0.0.0.255 area 0
snmp-server community public RO
line vty 0 4
 password cisco
 transport input telnet
 login`;

const goodConfig = `hostname R1
enable secret MyStr0ngPass
service password-encryption
line vty 0 4
 transport input ssh
 login local`;

check("bad config has 6 issues", checkConfigSecurity(badConfig).issuesCount, 6);
check(
  "good config has 0 issues",
  checkConfigSecurity(goodConfig).issuesCount,
  0,
);

console.log(failed === 0 ? "\nAll passed" : `\n${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
