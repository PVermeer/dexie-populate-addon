type Unpacked<T> =
    T extends (infer U)[] ? U :
    T extends (...args: any[]) => infer V ? V :
    T extends Promise<infer W> ? W :
    never;

type OmitMethods<T> = Pick<T, { [P in keyof T]: T[P] extends (...args: any[]) => any ? never : P; }[keyof T]>;
