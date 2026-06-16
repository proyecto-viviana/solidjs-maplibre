export type GlobalSettings = {
  maxParallelImageRequests?: number;
  RTLTextPlugin?: string | {pluginUrl: string; lazy?: boolean};
  workerCount?: number;
  workerUrl?: string;
};

export default function setGlobals(mapLib: any, props: GlobalSettings) {
  const {RTLTextPlugin, maxParallelImageRequests, workerCount, workerUrl} = props;
  if (
    RTLTextPlugin &&
    mapLib.getRTLTextPluginStatus &&
    mapLib.getRTLTextPluginStatus() === 'unavailable'
  ) {
    const {pluginUrl, lazy = true} =
      typeof RTLTextPlugin === 'string' ? {pluginUrl: RTLTextPlugin} : RTLTextPlugin;

    mapLib.setRTLTextPlugin(
      pluginUrl,
      (error?: Error) => {
        if (error) {
          console.error(error);
        }
      },
      lazy
    );
  }
  if (maxParallelImageRequests !== undefined) {
    mapLib.setMaxParallelImageRequests(maxParallelImageRequests);
  }
  if (workerCount !== undefined) {
    mapLib.setWorkerCount(workerCount);
  }
  if (workerUrl !== undefined) {
    mapLib.setWorkerUrl(workerUrl);
  }
}
