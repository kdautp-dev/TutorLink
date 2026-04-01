import Head from "next/head";
import "@/styles/globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>Homework4Cash</title>
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
