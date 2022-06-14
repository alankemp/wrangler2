import { readdirSync, statSync } from "fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { Box, Text, render, useStdout } from "ink";
import * as React from "react";
import type { DirectoryResult } from "tmp-promise";

const dirSize = (dirPath: string) =>
  readdirSync(dirPath)
    .map((file) => statSync(join(dirPath, file)))
    .reduce((acc, { size }) => acc + size, 0);

function getCompressedSize(size: string): string {
  return `${(dirSize(size) / 1024).toFixed(2)} KiB / gzip: ${(
    gzipSync(size).length / 1024
  ).toFixed(2)} KiB`;
}

export function BundleReporter({
  tempDirectory,
}: {
  tempDirectory: DirectoryResult;
}) {
  const { unmount } = render(<BundleSize tempDirectory={tempDirectory} />);

  unmount();
}

function BundleSize({ tempDirectory }: { tempDirectory: DirectoryResult }) {
  const { stdout } = useStdout();
  return (
    <Box
      borderStyle="round"
      padding={1}
      borderColor="greenBright"
      justifyContent="center"
      width={Math.min(stdout?.columns ?? 100, 100)}
    >
      <Text>Total Upload: {getCompressedSize(tempDirectory.path)}</Text>
    </Box>
  );
}
