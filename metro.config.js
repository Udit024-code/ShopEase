const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const config = getDefaultConfig(__dirname);

// https://github.com/supabase/supabase-js/issues/1258#issuecomment-2801695478
config.resolver = {
	...config.resolver,
	unstable_conditionNames: ["browser"],
	unstable_enablePackageExports: false,
	blockList: exclusionList([
		/node_modules\/@react-native\/\.gradle-plugin-.*\/.*?/, 
	]),
};

module.exports = withNativeWind(config, { input: "./global.css" });
