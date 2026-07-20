# Runtime validation

Every untrusted boundary uses an explicit Zod schema. Schemas parse transport or
provider data into safe inputs; TypeScript types alone are never treated as runtime
validation.
