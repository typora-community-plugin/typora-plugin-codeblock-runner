import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/c
export default makeOneCompilerBackend({ language: 'c', file: 'main.c' })
