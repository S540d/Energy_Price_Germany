export declare const EasNonInteractiveAndJsonFlags: {
    json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
};
export declare const EasEnvironmentFlagParameters: {
    description: string;
};
export declare const EASEnvironmentFlag: {
    environment: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
};
export declare const EASMultiEnvironmentFlag: {
    environment: import("@oclif/core/lib/interfaces").OptionFlag<string[] | undefined>;
};
export declare const EASVariableFormatFlag: {
    format: import("@oclif/core/lib/interfaces").OptionFlag<string>;
};
export declare const EASVariableVisibilityFlag: {
    visibility: import("@oclif/core/lib/interfaces").OptionFlag<"plaintext" | "sensitive" | "secret" | undefined>;
};
export type EASEnvironmentVariableScopeFlagValue = 'project' | 'account';
export declare const EASEnvironmentVariableScopeFlag: {
    scope: import("@oclif/core/lib/interfaces").OptionFlag<EASEnvironmentVariableScopeFlagValue>;
};
export declare const EASNonInteractiveFlag: {
    'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
};
export declare const EasJsonOnlyFlag: {
    json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
};
export declare const EasUpdateEnvironmentFlag: {
    environment: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
};
