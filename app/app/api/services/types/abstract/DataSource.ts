/**
 * getData shout return a list of objects, defined by the type param.
 * It can be a record, a class, or any other type.
 * The type param is used to define the shape of the data returned by the getData method.
 */
export abstract class DataSource<T = Record<string, unknown>> {
  abstract getData(): Promise<T[]>;
}
