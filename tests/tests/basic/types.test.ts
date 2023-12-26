import { makeSdk } from "./sdk.gen";
import { beforeEach, it } from "node:test";
import assert from "node:assert"
import { Equal, Expect } from "../utils";

let calls: any[][] = []
const lastCall = () => calls[calls.length - 1]
const emptyClient = async (...args: any[]) => {
  calls.push(args)
  return { data: {} }
}
const sdk = makeSdk({ client: emptyClient });
beforeEach(() => calls = [])

it("Uses correct path and method", () => {
  sdk.Blog.getTitles()
  assert.deepStrictEqual(lastCall()[0], { method: "get", url: "/blog/titles", params: {}, data: {} })
})

it("Must allow query params", () => {
  sdk.Blog.getLikes({ title: "title", max: 1 })
  assert.deepStrictEqual(lastCall()[0], { method: "get", url: "/blog/likes", params: { title: "title", optional: undefined, max: 1 }, data: {} })
})

it("Must allow body params", () => {
  sdk.Blog.setLikes({ title: "title", max: 1 })
  assert.deepStrictEqual(lastCall()[0], { method: "post", url: "/blog/likes", params: {}, data: { title: "title", max: 1, optional: undefined } })
})

it("Path params are included in config object", () => {
  sdk.Blog.getDate({ id: "postId123" })
  assert.deepStrictEqual(lastCall()[0], { method: "get", url: "/blog/posts/postId123/date", params: {}, data: {} })
})

it("Required must be specified", () => {
  function typeTest() {
    // @ts-expect-error
    sdk.Blog.getLikes({ title: "title" });
  }
})

it("Optional may not be specified", () => {
  function typeTest() {
    sdk.Blog.getLikes({ title: "title", max: 1, optional: 1 });
  }
})

it("Simple return type is preserved", () => {
  async function typeTest() {
    const ret = await sdk.Blog.getLikes({ title: "title", max: 1 });
    type Test = Expect<Equal<typeof ret, number>>;
  }
})

it("Array return type is preserved", () => {
  async function typeTest() {
    const ret = await sdk.Blog.getTitles();
    type Test = Expect<Equal<typeof ret, string[]>>;
  }
})
