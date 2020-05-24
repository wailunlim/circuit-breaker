library(ggplot2)
library(dplyr)
library(chron)
library(stringr)
library(tidyverse)
library(tidytext)

setwd("~/Desktop/FTL_Hackathon/circuit-breaker")
covidtwt<-data.frame()
# for loop to join data
for (i in 1:143) {
  filename<-paste('melissa',i,'.csv',sep="")
  rawdata<-read.csv(filename)
  covidtwt<-rbind(covidtwt,rawdata)
}
covidtwt<-covidtwt%>%as.data.frame()%>%separate(created_at,c('day','mth','date','time','del','year'), " +")%>%
  mutate(twtdate=as.Date(paste(date,mth,year,sep="-"),'%d-%B-%Y'),time=chron(times=time),day=factor(day,levels = c('Sun','Mon','Tue','Wed','Thu','Fri','Sat')))%>%
  select(-c(mth,year,date,del))%>%mutate_if(is.character,as.factor)
summary(covidtwt)

# plot of number of tweets per date (put all dates)
ggplot(covidtwt%>%group_by(twtdate,sentiment, .drop = FALSE)%>%summarise(count=length(tweet_id))%>%
         filter(sentiment !=""))+
  geom_line(aes(x=twtdate,y=count,color=sentiment),position='dodge',stat='identity')+
  scale_x_date("Date",date_labels="%d %b %y",date_breaks = "1 day")+
  scale_y_continuous("Frequency")+
  scale_color_manual(values=c("skyblue2","honeydew4","salmon1","red","blue"))

#count number of tweets per day
ggplot(covidtwt%>%filter(sentiment!="")%>%group_by(day,sentiment)%>%summarise(count=n())%>%mutate(perc=count/sum(count)*100)%>%ungroup())+
  geom_bar(aes(x=day,y=perc,fill=sentiment),stat='identity', position = 'stack')+
  #geom_text(aes(x=day,y=perc,label=round(perc,1)),size=4,position = position_stack(vjust=0.5))+
  scale_x_discrete("Day")+
  scale_y_continuous("Percentage")+
  scale_fill_manual(values=c("skyblue2","honeydew4","salmon1","moccasin"))

# tweet reach (sum like, comments, retweets)
avglike<-round(mean(as.integer(covidtwt$favorite_count)),2)
avgcomment<-round(mean(as.integer(covidtwt$reply_count)),2)
avgrt<-round(mean(as.integer(covidtwt$retweet_count)),2)

# engagement per sentiment
temp<-covidtwt%>%group_by(sentiment)%>%mutate(engagement=ifelse(retweet_count+reply_count+favorite_count>0,'engaged','no engagement'))%>%ungroup()%>%
  group_by(sentiment, engagement)%>%summarise(count=n())%>%ungroup()%>%group_by(sentiment)%>%mutate(perc=count/sum(count)*100)%>%filter(sentiment!=""&engagement!="no engagement")

ggplot(temp)+
  geom_bar(aes(x=sentiment, y=perc),stat = 'identity',fill="skyblue")+
  ylab("Percentage")+
  xlab("Sentiment")

# length of tweet
ggplot(covidtwt)+
  geom_histogram(aes(x=word_count),color="white",binwidth = 1,fill="skyblue")+
  scale_x_continuous(limits = c(0,40))+
  xlab("Number of Words in Tweet")+
  ylab("Count")

# other hashtags used
raw<-as.data.frame(covidtwt$hashtags)
colnames(raw)[1]<-'hashtag'
hashtags<-raw%>%mutate(hashtag=str_replace_all(trimws(str_replace_all(hashtag,"[[:punct:]]", " ")),"   "," "))%>%
  unnest_tokens('word',hashtag)%>%count(word)%>%arrange(desc(n))%>%filter(word != 'wfh')
top_tags<-head(hashtags,30)

ggplot(top_tags, aes(x=reorder(word,-n), y=n))+
  geom_bar(stat="identity")+
  theme_minimal()+
  theme(axis.text.x = element_text(angle = 90, hjust = 1))+
  ylab("Count")+
  xlab("Hashtags")+
  labs(title="Hashtags used with #wfh")












