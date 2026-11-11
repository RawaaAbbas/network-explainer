export function calculateSubnet(ip: string, cidr: number) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return { error: " عنوانIP غير صحيح" };
  }
  if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) {
    return { error: "قيمة CIDR لازم تكون بين 0 و 32" };
  }

  const ipNum =
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
  const mask = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;

  const toIp = (n: number) =>
    [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");

  const totalAddresses = 2 ** (32 - cidr);
  const usableHosts = Math.max(totalAddresses - 2, 0);

  return {
    network: toIp(network),
    broadcast: toIp(broadcast),
    subnetMask: toIp(mask),
    totalAddresses,
    usableHosts,
    firstHost: usableHosts > 0 ? toIp(network + 1) : null,
    lastHost: usableHosts > 0 ? toIp(broadcast - 1) : null,
  };
}

export function checkConfigSecurity(config: string) {
  const lines = config
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0);

  const issues: string[] = [];

  if (lines.some((l) => l.startsWith("enable password"))) {
    issues.push(
      "enable password stores the password in clear text. Use enable secret instead.",
    );
  }

  const weakPasswords = [
    "cisco",
    "cisco123",
    "admin",
    "password",
    "123456",
    "1234",
  ];
  for (const l of lines) {
    const match = l.match(/^(?:enable )?password (\S+)$/);
    if (match && weakPasswords.includes(match[1])) {
      issues.push(`Weak password in line: "${l.replace(match[1], "***")}"`);
    }
  }

  const hasVty = lines.some((l) => l.startsWith("line vty"));
  const telnetAllowed = lines.some(
    (l) => l === "transport input telnet" || l === "transport input all",
  );
  const sshOnly = lines.some((l) => l === "transport input ssh");
  if (telnetAllowed || (hasVty && !sshOnly)) {
    issues.push(
      "Remote access may allow Telnet (clear text). Use: transport input ssh",
    );
  }

  const hasPasswords = lines.some((l) => l.includes("password"));
  if (hasPasswords && !lines.includes("service password-encryption")) {
    issues.push(
      "service password-encryption is not enabled, so line passwords are stored in clear text.",
    );
  }

  if (
    lines.some(
      (l) =>
        l.startsWith("snmp-server community public") ||
        l.startsWith("snmp-server community private"),
    )
  ) {
    issues.push("Default SNMP community string (public/private) is used.");
  }

  if (lines.includes("ip http server")) {
    issues.push(
      "HTTP server is enabled (unencrypted). Use ip http secure-server or disable it.",
    );
  }

  return { issuesCount: issues.length, issues };
}
