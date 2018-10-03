package main

import (
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-xray-sdk-go/xray"
)

func init() {
	xray.Configure(xray.Config{
		DaemonAddr:     "127.0.0.1:2000", // default
		LogLevel:       "info",           // default
		ServiceVersion: "1.2.3",
	})
}

func main() {
	lambda.Start(handler)
}
