import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/powershell
export default makeOneCompilerBackend({ language: 'powershell', file: 'main.ps1' })
