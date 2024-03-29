import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
      return (context.getArgs()[0] as any).user || null;
    },
  );
  