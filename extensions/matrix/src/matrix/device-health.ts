export type MatrixManagedDeviceInfo = {
  deviceId: string;
  displayName: string | null;
  current: boolean;
};

export type MatrixDeviceHealthSummary = {
  currentDeviceId: string | null;
  staleCarlitoDevices: MatrixManagedDeviceInfo[];
  currentCarlitoDevices: MatrixManagedDeviceInfo[];
};

const CARLITO_DEVICE_NAME_PREFIX = "Carlito ";

export function isCarlitoManagedMatrixDevice(displayName: string | null | undefined): boolean {
  return displayName?.startsWith(CARLITO_DEVICE_NAME_PREFIX) === true;
}

export function summarizeMatrixDeviceHealth(
  devices: MatrixManagedDeviceInfo[],
): MatrixDeviceHealthSummary {
  const currentDeviceId = devices.find((device) => device.current)?.deviceId ?? null;
  const carlitoDevices = devices.filter((device) =>
    isCarlitoManagedMatrixDevice(device.displayName),
  );
  return {
    currentDeviceId,
    staleCarlitoDevices: carlitoDevices.filter((device) => !device.current),
    currentCarlitoDevices: carlitoDevices.filter((device) => device.current),
  };
}
