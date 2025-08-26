export type Provider = {
  id: string;
  name: string;
};

export type DataPackage = {
  id: string;
  providerId: string;
  name: string;
  description: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
};

export const providers: Provider[] = [];
export const dataPackages: DataPackage[] = [];
export const users: User[] = [];

let providerId = 1;
let dataPackageId = 1;
let userId = 1;

export function nextProviderId(): string {
  return String(providerId++);
}

export function nextDataPackageId(): string {
  return String(dataPackageId++);
}

export function nextUserId(): string {
  return String(userId++);
}
