import { BFooInterface, BFooInterface2 } from "./other-file-b";

export interface ABazInterface<T> {
  bar: BFooInterface & T
}

export type AAliasOfBFooInterface = BFooInterface2
