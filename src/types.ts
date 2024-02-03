/* eslint-disable @typescript-eslint/no-explicit-any */
export type Callable = (...args: Array<any>) => any;

export type PropPath<T extends object> = {
    [k in keyof T]:
    (
        k extends string ?
        (
            T[k] extends Callable ? k :
            (
                T[k] extends Array<any> ? never :
                (
                    T[k] extends object ? `${k}.${PropPath<T[k]>}` : never
                )
            )
        )
        : never
    )
}[keyof T];

export type Keys<T extends object> = {
    [k in keyof T]:
    (
        k extends string ?
        (
            T[k] extends Callable ? k :
            (
                T[k] extends Array<any> ? never :
                (
                    T[k] extends object ? k : never
                )
            )
        ) : never
    )
}[keyof T]

export type Async<T extends object> = {
    [k in Keys<T>]: (
        T[k] extends Callable ?
        (
            (
                ReturnType<T[k] extends Callable ? T[k] : never> extends Promise<any> ? T[k] : (...args: Parameters<T[k]>) => Promise<ReturnType<T[k] extends Callable ? T[k] : never>>
            )
        ) : (
            T[k] extends object ? Async<T[k]> : never
        )
    )
};