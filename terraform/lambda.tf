# ---------------------------------------------
# AI Simulation Bot (Lambda + EventBridge) 설정
# ---------------------------------------------

data "archive_file" "bot_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/bot_lambda"
  output_path = "${path.module}/bot_lambda.zip"
}

resource "aws_iam_role" "lambda_bot_role" {
  name = "daypoo_simulation_bot_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_bot_basic_execution" {
  role       = aws_iam_role.lambda_bot_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "simulation_bot" {
  function_name    = "daypoo_ai_simulation_bot"
  filename         = data.archive_file.bot_lambda_zip.output_path
  source_code_hash = data.archive_file.bot_lambda_zip.output_base64sha256
  handler          = "main.lambda_handler"
  runtime          = "python3.12"
  role             = aws_iam_role.lambda_bot_role.arn
  timeout          = 600 # 봇 수 증가에 따른 안정적인 수행을 위해 10분으로 상향

  environment {
    variables = {
      API_BASE_URL   = "https://${aws_cloudfront_distribution.main.domain_name}/api/v1" # CloudFront API 경로를 동적으로 참조
      OPENAI_API_KEY = var.openai_api_key
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_bot_basic_execution
  ]
}

# ---------------------------------------------
# EventBridge (CloudWatch Events) 스케줄 트리거
# ---------------------------------------------

# KST 시간 기준: 08:00, 13:00, 19:00, 23:00 
# UTC 시간 기준: 23:00(전날), 04:00, 10:00, 14:00
resource "aws_cloudwatch_event_rule" "simulation_schedule" {
  name                = "daypoo_bot_daily_schedule"
  description         = "Trigger DayPoo simulation bot 4 times a day (KST 08:00, 13:00, 19:00, 23:00)"
  schedule_expression = "cron(0 23,4,10,14 * * ? *)"
}

resource "aws_cloudwatch_event_target" "simulation_target" {
  rule      = aws_cloudwatch_event_rule.simulation_schedule.name
  target_id = "daypoo_simulation_bot_target"
  arn       = aws_lambda_function.simulation_bot.arn
}

resource "aws_lambda_permission" "allow_eventbridge_to_call_bot" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.simulation_bot.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.simulation_schedule.arn
}
