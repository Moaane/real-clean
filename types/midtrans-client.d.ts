// Minimal typings: midtrans-client ships none. Only what lib/midtrans.ts uses.
declare module "midtrans-client" {
  interface SnapOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }
  interface SnapClient {
    createTransaction(parameter: Record<string, unknown>): Promise<{ token: string; redirect_url: string }>;
  }
  const midtransClient: { Snap: new (options: SnapOptions) => SnapClient };
  export default midtransClient;
}
