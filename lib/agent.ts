import { Type, type FunctionDeclaration } from "@google/genai";
import { calculateSubnet, checkConfigSecurity } from "./tools";
import { findRelevant } from "./rag";

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "calculate_subnet",
    description:
      "Calculates the network address, broadcast address, subnet mask and number of usable hosts for an IPv4 address with a CIDR prefix.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ip: {
          type: Type.STRING,
          description: "IPv4 address, for example 192.168.1.10",
        },
        cidr: {
          type: Type.NUMBER,
          description: "CIDR prefix length from 0 to 32, for example 24",
        },
      },
      required: ["ip", "cidr"],
    },
  },
  {
    name: "check_config_security",
    description:
      "Scans a Cisco device configuration text and returns a list of security issues found in it.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        config: {
          type: Type.STRING,
          description: "The full configuration text to check",
        },
      },
      required: ["config"],
    },
  },
  {
    name: "search_docs",
    description:
      "Searches the networking study document and returns the most relevant passages. Use it for theory questions about networking concepts and protocols.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        question: {
          type: Type.STRING,
          description: "The question or topic to search for",
        },
      },
      required: ["question"],
    },
  },
];

export async function runTool(name: string, args: Record<string, unknown>) {
  if (name === "calculate_subnet") {
    return calculateSubnet(String(args.ip), Number(args.cidr));
  }
  if (name === "check_config_security") {
    return checkConfigSecurity(String(args.config));
  }
  if (name === "search_docs") {
    const passages = await findRelevant(String(args.question));
    return { passages };
  }
  return { error: `Unknown tool: ${name}` };
}
