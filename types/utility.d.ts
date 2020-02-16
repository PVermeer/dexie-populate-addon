type Unpacked<T> =
    T extends (infer U)[] ? U :
    T extends (...args: any[]) => infer V ? V :
    T extends Promise<infer W> ? W :
    never;

type OmitMethods<T> = Pick<T, { [P in keyof T]: T[P] extends Function ? never : P; }[keyof T]>;
