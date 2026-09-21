import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/csharp — served by the JSON endpoint, see onecompiler.ts.
export default makeOneCompilerBackend({ language: 'csharp', file: 'HelloWorld.cs' })
