FROM amazoncorretto:21-alpine AS builder
WORKDIR /app
COPY . .
RUN ./gradlew bootJar -x test

FROM amazoncorretto:21-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
# t2.micro(1GB RAM)를 고려한 JVM 메모리 최적화 설정
ENV JAVA_OPTS="-Xmx384m -Xms256m -XX:+UseG1GC"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
