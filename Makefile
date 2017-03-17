#this image is design as a starting point 

IMG_TAG=triplewave

build:
	docker rmi $(IMG_TAG); true
	docker build -t $(IMG_TAG) .

publish:
	docker push tomma/$(IMG_TAG)