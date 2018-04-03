FROM python:onbuild
EXPOSE 8080
RUN pip install -r requirements.txt
ENTRYPOINT ["python"]
CMD ["app.py"]
