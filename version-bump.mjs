import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;

// read minAppVersion from manifest.json and bump version
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const manifestVersion = manifest.version;

if (targetVersion === manifestVersion) {
    console.log("Version matches, no bump needed");
    process.exit(0);
}

console.log(`Bumping version from ${manifestVersion} to ${targetVersion}`);

manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

