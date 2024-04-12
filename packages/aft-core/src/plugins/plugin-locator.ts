export type PluginLocator = {
    /**
     * the filename of the plugin minus any path and suffix.
     * 
     * ex: `"my-custom-plugin"`
     */
    name: string;
    /**
     * the root directory from which to start searching for the plugin
     * file.
     * 
     * ex: `"./node_modules/path/to/plugin/"`
     */
    searchDir: string;
}