import {
    GraduationCap,
    TrendingUp,
    Code,
    Feather,
    Scale,
} from "lucide-react-native";

export const PRESET_ICONS = {
    academic: GraduationCap,
    finance: TrendingUp,
    programming: Code,
    writer: Feather,
    legal: Scale,
};

export interface Preset {
    label: string;
    description: string;
    chairman: string;
    members: string[];
}

export const PRESETS: Record<string, Preset> = {
    academic: {
        label: "Academic",
        description: "Highest context for long papers",
        chairman: "xiaomi/mimo-v2-flash:free",
        members: [
            "deepseek/deepseek-r1-0528:free",
            "xiaomi/mimo-v2-flash:free",
            "mistralai/devstral-2512:free",
            "openai/gpt-oss-120b:free",
        ],
    },
    finance: {
        label: "Finance",
        description: "Deep analysis & reporting",
        chairman: "xiaomi/mimo-v2-flash:free",
        members: [
            "google/gemma-3-27b-it:free",
            "tngtech/deepseek-r1t-chimera:free",
            "qwen/qwen3-coder:free",
            "arcee-ai/trinity-mini:free",
        ],
    },
    programming: {
        label: "Coding",
        description: "Code generation & review",
        chairman: "qwen/qwen3-coder:free",
        members: [
            "qwen/qwen3-coder:free",
            "kwaipilot/kat-coder-pro:free",
            "mistralai/devstral-2512:free",
            "nvidia/nemotron-3-nano-30b-a3b:free",
        ],
    },
    writer: {
        label: "Writer",
        description: "Creative writing & roleplay",
        chairman: "tng/deepseek-r1t2-chimera:free",
        members: [
            "tng/deepseek-r1t2-chimera:free",
            "nousresearch/hermes-3-llama-3.1-405b:free",
            "google/gemma-3-12b-it:free",
            "mistralai/mistral-small-24b-instruct-2501:free",
        ],
    },
    legal: {
        label: "Legal",
        description: "Document analysis",
        chairman: "mistralai/devstral-2512:free",
        members: [
            "google/gemma-3n-e4b-it:free",
            "xiaomi/mimo-v2-flash:free",
            "mistralai/devstral-2512:free",
            "z-ai/glm-4.5-air:free",
        ],
    },
};
