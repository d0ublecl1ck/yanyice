import dynamic from "next/dynamic";
import Head from "next/head";

const YanyiceApp = dynamic(() => import("../src/yanyice/App"), { ssr: false });

export default function IndexPage() {
  return (
    <>
      <Head>
        <title>研易册 - 命理工作台</title>
      </Head>
      <YanyiceApp />
    </>
  );
}

