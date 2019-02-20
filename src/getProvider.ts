import { INVALID_SERVERLESS_ENV, INVALID_SERVERLESS_PROJECT } from "./constants";

// 用于更高效更兼容的判断Serverless版本
let Serverless: any;
try {
  Serverless = require("serverless");
} catch (e) {
  // 从公共库中读取
  try {
    Serverless = require("requireg")("serverless");
  } catch (e) {}
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
}
const jsonBoundary = process.env.JSON_BOUNDARY || guid();

async function getProviderName() {
  if (!Serverless) {
    throw INVALID_SERVERLESS_ENV;
  }

  const sls = new Serverless({
    servicePath: process.cwd()
  });

  await sls.service.load();

  return sls.service.provider.name
}

function output(data: any) {
  console.log(`jsonBoundary(${jsonBoundary})`);
  console.log(`${jsonBoundary}(${JSON.stringify(data)})${jsonBoundary}`);
}

async function main(){
  try{
    output({
      success: true,
      data: await getProviderName() 
    });
  }catch(e){
    output({
      success: false,
      error: typeof e === 'string' ? e : INVALID_SERVERLESS_PROJECT
    })
  }
}

main();
