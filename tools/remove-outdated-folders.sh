#!/bin/sh

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <bucket> <file_name> <age || 3>"
    exit 1
fi

bucket=$1
file_name=$2
age=${3:-3}

if ! [ "$age" -gt 0 ]; then
    echo "Not valid age: $age"
    exit 1
fi

tags=$(aws s3api list-objects-v2 \
    --bucket $bucket \
    --query "Contents[?ends_with(Key, '/$file_name')].Key" \
    --output text
)

mkdir ./tags
for tag_path in $tags; do
    pr=$(dirname "$tag_path")
    aws s3 cp s3://$bucket/$tag_path ./tags/$pr.tag
done

now_time=$(date -u +%s)
for tag_path in ./tags/*.tag; do
    pr_tag=$(cat "$tag_path")
    closed_time=$(date -u -d "$pr_tag" +%s)
    diff=$(( (now_time - closed_time) / 86400 ))
    echo "$tag_path $pr_tag $closed_time $diff"
    if [ "$diff" -gt "$age" ]; then
        pr=$(basename "$tag_path" .tag)
        aws s3 rm --recursive s3://$bucket/$pr/
    fi
done

rm -rf ./tags
