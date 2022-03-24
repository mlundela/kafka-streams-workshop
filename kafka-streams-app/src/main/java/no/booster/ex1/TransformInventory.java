package no.booster.ex1;

import no.booster.avro.Author;
import no.booster.avro.Book;
import org.apache.kafka.streams.KeyValue;
import org.apache.kafka.streams.kstream.KStream;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.function.Function;

@Configuration
public class TransformInventory {

	@Bean
	public Function<KStream<no.booster.inventory.book.Key, no.booster.inventory.book.Envelope>, KStream<String, Book>> transformBook() {
		// Exercise 1: Transform stream of Debezium records
		// Input: Stream of records from Debezium
		// Output: Stream of Book records, with bookId as key (key: bookId, value: Book)
		return books -> books.map((k, v) -> new KeyValue<>(k.getIsbn().toString(), transformBook(k, v)));
	}

	private Book transformBook(no.booster.inventory.book.Key k, no.booster.inventory.book.Envelope v) {
		if (v == null || v.getAfter() == null) return null;
		return Book.newBuilder()
				.setIsbn(k.getIsbn())
				.setTitle(v.getAfter().getTitle())
				.setDescription(v.getAfter().getDescription())
				.setAuthorId(v.getAfter().getAuthorId())
				.setThumbnail(v.getAfter().getThumbnail())
				.build();
	}

	@Bean
	public Function<KStream<no.booster.inventory.author.Key, no.booster.inventory.author.Envelope>, KStream<String, Author>> transformAuthor() {
		return authors -> authors.map((k, v) -> new KeyValue<>(String.valueOf(k.getId()), transformAuthor(v)));
	}

	private Author transformAuthor(no.booster.inventory.author.Envelope v) {
		if (v == null || v.getAfter() == null) return null;
		return Author.newBuilder()
				.setName(v.getAfter().getName())
				.build();
	}
}
