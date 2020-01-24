declare module 'png-js' {
  interface PNG {
    new (data: any): any
  }
  const MyClass: PNG
  export = MyClass
}
