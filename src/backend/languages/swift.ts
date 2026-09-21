import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/swift — served by the JSON endpoint, see onecompiler.ts.
export default makeOneCompilerBackend({ language: 'swift', file: 'main.swift' })
