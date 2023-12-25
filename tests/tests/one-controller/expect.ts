/**
 * These are static types. If something wrong happens to the generated code, this file
 * will fail to compile
 */

import axios from "axios";
import { sdk } from "./sdk.gen";

export const mustGenerate = () =>
  sdk({ client: axios }).Blog.getTitles();

export const queryParam = () =>
  sdk({ client: axios }).Blog.getLikes({ title: "title", max: 1 });

export const requiredMustBeSpecified = () =>
  // @ts-expect-error
  sdk({ client: axios }).Blog.getLikes({ title: "title" });

export const optionalMayNotBeSpecified = () =>
  sdk({ client: axios }).Blog.getLikes({ title: "title", max: 1 });

export const optionalMayBeSpecified = () =>
  sdk({ client: axios }).Blog.getLikes({ title: "title", max: 1, optional: 1 });

export const pathParamsAreFirstArgs = () =>
  sdk({ client: axios }).Blog.getDate("postId");
