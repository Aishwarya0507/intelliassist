export type FunctionType = 'question'|'summarize'|'creative'|'advice'
export type PromptStyle = 'concise'|'balanced'|'detailed'
export interface GenerateResult {interaction_id:number;response:string;prompt_used:string;demo_mode:boolean}
export interface Analytics {total_requests:number;helpful:number;not_helpful:number;helpful_rate:number;function_usage:Record<string,number>;style_usage:Record<string,number>}
export interface GenerateRequest {
  function_type: FunctionType;
  prompt_style: PromptStyle;
  tone: string;
  output_format: string;
  user_input: string;
  provider?: string;
  model?: string;
  api_key?: string;
}
