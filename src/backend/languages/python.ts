import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/python
export default makeOneCompilerBackend({ language: 'python', file: 'main.py' })
