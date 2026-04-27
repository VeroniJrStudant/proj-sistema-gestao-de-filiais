declare module "pix-payload" {
  export function payload(props: {
    name: string;
    key: string;
    amount?: number;
    city: string;
    transactionId?: string;
  }): string;
}
