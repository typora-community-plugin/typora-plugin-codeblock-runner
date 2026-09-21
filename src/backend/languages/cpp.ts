import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/cpp
export default makeOneCompilerBackend({ language: 'cpp', file: 'main.cpp' })
