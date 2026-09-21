import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/dart — served by the JSON endpoint, see onecompiler.ts.
export default makeOneCompilerBackend({ language: 'dart', file: 'main.dart' })
