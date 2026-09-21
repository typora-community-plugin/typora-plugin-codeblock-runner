import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/bash
export default makeOneCompilerBackend({ language: 'bash', file: 'main.sh' })
