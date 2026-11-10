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
  interface CoreApiClient {
    transaction: {
      refund(orderId: string, parameter: Record<string, unknown>): Promise<{ status_code?: string; status_message?: string }>;
    };
  }
  const midtransClient: {
    Snap: new (options: SnapOptions) => SnapClient;
    CoreApi: new (options: SnapOptions) => CoreApiClient;
  };
  export default midtransClient;
}
