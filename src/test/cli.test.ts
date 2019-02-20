import * as assert from "assert";
import { pickupJsons } from "../cli";

suite("cli", function() {
  const cliOutput = `
asdfahgdfghdfgh
jsonBoundary(84b07d24-ebc7-9567-199f-18d1b36402cc)
84b07d24-ebc7-9567-199f-18d1b36402cc(null)84b07d24-ebc7-9567-199f-18d1b36402cc
asdfhdxfg
84b07d24-ebc7-9567-199f-18d1b36402cc("string")84b07d24-ebc7-9567-199f-18d1b36402cc
sadfhgsdfg
84b07d24-ebc7-9567-199f-18d1b36402cc({"a":"1","b":1})84b07d24-ebc7-9567-199f-18d1b36402cc
hdfghgdfghe
`;
  // Defines a Mocha unit test
  test("解析json输出", function() {
    assert.deepEqual(pickupJsons(cliOutput), [
      null,
      "string",
      { a: "1", b: 1 }
    ]);
  });
});
