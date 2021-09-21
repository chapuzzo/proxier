#!/bin/sh

echo $@
echo -n 'waiting for rabbitmq...'

while ! nc -z rabbitmq:5672
do
	sleep 1
	echo -n .
done

echo 'done'

exec $@
