# Wallet Connection Demo

A simple Next.js application demonstrating wallet connection and network switching functionality using WalletConnect's AppKit.

## Features

- Connect crypto wallets using WalletConnect's AppKit
- Support for multiple EVM chains: Ethereum, Arbitrum, Optimism, Polygon
- Network switching capability
- Clean UI with shadcn components

## Prerequisites

- Node.js 18+ 
- npm or yarn
- WalletConnect Cloud Project ID

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Get a Project ID from [Reown Cloud](https://cloud.reown.com) by creating an account and a new project
   - Add your Project ID to the `.env` file:
   ```
   NEXT_PUBLIC_PROJECT_ID=your_project_id_here
   ```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to Use

1. Click the "Connect Wallet" button to connect your crypto wallet.
2. Once connected, you'll see a "Network Selection" button appear.
3. Use this button to switch between different blockchain networks.

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [WalletConnect AppKit](https://docs.reown.com/appkit/overview) - Wallet connection SDK
- [wagmi](https://wagmi.sh/) - React hooks for Ethereum

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
